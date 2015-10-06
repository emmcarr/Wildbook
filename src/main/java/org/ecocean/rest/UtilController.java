package org.ecocean.rest;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.ecocean.Global;
import org.ecocean.Organization;
import org.ecocean.Species;
import org.ecocean.security.UserFactory;
import org.ecocean.servlet.ServletUtilities;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.samsix.database.Database;
import com.samsix.database.DatabaseException;

@RestController
@RequestMapping(value = "/util")
public class UtilController {
    @RequestMapping(value = "/render", method = RequestMethod.GET)
    public String renderJade(final HttpServletRequest request,
                             @RequestParam("j")
                             final String template)
    {
        return ServletUtilities.renderJade(request, template);
    }

    @RequestMapping(value = "/init", method = RequestMethod.GET)
    public GlobalConfig init(final HttpServletRequest request) throws DatabaseException {
        try (Database db = ServletUtilities.getDb(request)) {
            GlobalConfig config = new GlobalConfig();
            config.orgs = UserFactory.getOrganizations(db);

            config.species = Global.INST.getSpecies();
            return config;
        }
    }

    private static class GlobalConfig
    {
        @SuppressWarnings("unused")
        public List<Organization> orgs;
        @SuppressWarnings("unused")
        public List<Species> species;
    }
}
